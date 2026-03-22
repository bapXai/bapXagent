"""
Trailbase Database & Authentication Service

This service provides:
1. User authentication via Trailbase auth
2. Multi-tenant database management (one DB per user)
3. Project table creation within user databases

Architecture:
- Main DB: /root/Agent/traildepot/data/main.db (system tables, users)
- User DBs: /root/Agent/traildepot/data/{user_id}.db (user data, projects)
- Each user gets complete isolation with their own SQLite database
"""

from typing import Optional, Dict, Any, List
import os
import httpx
import asyncio
import aiosqlite
import json
from pathlib import Path
from core.utils.logger import logger
from core.utils.config import config
import secrets
import hashlib

# Trailbase configuration
TRAILBASE_URL = os.getenv('TRAILBASE_URL', 'http://localhost:4000/v1')
TRAILBASE_ADMIN_KEY = os.getenv('TRAILBASE_ADMIN_KEY', 'vn2gVGUvxLMs9w5cwYK6')
TRAILBASE_PUBLIC_URL = os.getenv('TRAILBASE_PUBLIC_URL', 'http://localhost:4000')
TRAILDEPOT_DATA_DIR = Path('/root/Agent/traildepot/data')


class TrailbaseService:
    """
    Singleton Trailbase service for auth and database management.
    """
    
    _instance: Optional['TrailbaseService'] = None
    _lock = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
            cls._instance._client = None
            cls._instance._admin_client = None
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        self._lock = asyncio.Lock()
        
        # Public client for user operations
        self._client = httpx.AsyncClient(
            base_url=TRAILBASE_PUBLIC_URL,
            timeout=30.0
        )
        
        # Admin client for administrative operations
        self._admin_client = httpx.AsyncClient(
            base_url=TRAILBASE_URL,
            headers={
                "Authorization": f"Bearer {TRAILBASE_ADMIN_KEY}"
            },
            timeout=30.0
        )
    
    async def close(self):
        """Close HTTP clients."""
        if self._client:
            await self._client.aclose()
        if self._admin_client:
            await self._admin_client.aclose()
    
    # ========== Authentication ==========
    
    async def signup(self, email: str, password: str, password_repeat: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new user account.

        Args:
            email: User email
            password: User password
            password_repeat: Password confirmation (optional, defaults to password)

        Returns:
            Dict with user info and tokens
        """
        try:
            response = await self._client.post(
                "/api/auth/v1/register",
                json={
                    "email": email,
                    "password": password,
                    "password_repeat": password_repeat or password
                }
            )
            response.raise_for_status()
            data = response.json()

            # Create user database
            user_id = data.get('user', {}).get('id')
            if user_id:
                await self.create_user_database(user_id)

            return data
        except httpx.HTTPStatusError as e:
            logger.error(f"Trailbase signup failed: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Trailbase signup error: {e}")
            raise

    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user and return tokens.

        Args:
            email: User email
            password: User password

        Returns:
            Dict with access_token, refresh_token, and user info
        """
        try:
            response = await self._client.post(
                "/api/auth/v1/login",
                json={
                    "email": email,
                    "password": password
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Trailbase login failed: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Trailbase login error: {e}")
            raise

    async def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify a JWT token and return user info.

        Args:
            token: JWT access token

        Returns:
            User info dict or None if invalid
        """
        try:
            response = await self._client.get(
                "/api/auth/v1/status",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None

    async def send_otp(self, email: str) -> bool:
        """
        Send OTP to user email (via password reset flow).

        Args:
            email: User email

        Returns:
            True if sent successfully
        """
        try:
            # Use password reset endpoint to send verification email
            response = await self._client.post(
                "/api/auth/v1/reset_password/request",
                json={"email": email}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Send OTP error: {e}")
            return False
    
    # ========== Multi-tenant Database Management ==========
    
    def get_user_db_path(self, user_id: str) -> Path:
        """Get the path to a user's database file."""
        return TRAILDEPOT_DATA_DIR / f"{user_id}.db"
    
    async def create_user_database(self, user_id: str) -> bool:
        """
        Create a new SQLite database for a user.
        
        Args:
            user_id: The user's unique ID
            
        Returns:
            True if created successfully
        """
        try:
            db_path = self.get_user_db_path(user_id)
            
            if db_path.exists():
                logger.info(f"User database already exists: {db_path}")
                return True
            
            # Create database and system tables
            async with aiosqlite.connect(db_path) as db:
                # Enable WAL mode for better concurrency
                await db.execute("PRAGMA journal_mode=WAL")
                
                # Create projects table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS projects (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        domain TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        config JSON,
                        user_id TEXT NOT NULL
                    )
                """)
                
                # Create threads table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS threads (
                        id TEXT PRIMARY KEY,
                        name TEXT,
                        project_id TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        metadata JSON,
                        FOREIGN KEY (project_id) REFERENCES projects(id)
                    )
                """)
                
                # Create messages table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS messages (
                        id TEXT PRIMARY KEY,
                        thread_id TEXT NOT NULL,
                        role TEXT NOT NULL,
                        content TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        metadata JSON,
                        FOREIGN KEY (thread_id) REFERENCES threads(id)
                    )
                """)
                
                # Create agents table
                await db.execute("""
                    CREATE TABLE IF NOT EXISTS agents (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        project_id TEXT,
                        config JSON,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (project_id) REFERENCES projects(id)
                    )
                """)
                
                await db.commit()
            
            logger.info(f"Created user database: {db_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create user database: {e}")
            return False
    
    async def get_user_db_connection(self, user_id: str) -> aiosqlite.Connection:
        """
        Get a database connection for a user.
        
        Args:
            user_id: The user's ID
            
        Returns:
            aiosqlite.Connection
        """
        db_path = self.get_user_db_path(user_id)
        
        if not db_path.exists():
            # Auto-create user database if it doesn't exist
            await self.create_user_database(user_id)
        
        return await aiosqlite.connect(db_path)
    
    async def execute_user_query(
        self,
        user_id: str,
        query: str,
        params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute a query on a user's database.
        
        Args:
            user_id: The user's ID
            query: SQL query
            params: Query parameters
            
        Returns:
            List of result rows as dicts
        """
        conn = None
        try:
            conn = await self.get_user_db_connection(user_id)
            conn.row_factory = aiosqlite.Row
            
            if params:
                async with conn.execute(query, params) as cursor:
                    rows = await cursor.fetchall()
                    return [dict(row) for row in rows]
            else:
                async with conn.execute(query) as cursor:
                    rows = await cursor.fetchall()
                    return [dict(row) for row in rows]
                    
        except Exception as e:
            logger.error(f"User query error: {e}")
            raise
        finally:
            if conn:
                await conn.close()
    
    # ========== Project Management ==========
    
    async def create_project(
        self,
        user_id: str,
        name: str,
        domain: Optional[str] = None,
        config: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Create a new project in user's database.
        
        Args:
            user_id: User ID
            name: Project name
            domain: Optional subdomain (e.g., "myproject.bapx.in")
            config: Project configuration
            
        Returns:
            Created project info
        """
        import uuid
        
        project_id = str(uuid.uuid4())
        
        await self.execute_user_query(
            user_id,
            """
            INSERT INTO projects (id, name, domain, config, user_id)
            VALUES (:id, :name, :domain, :config, :user_id)
            """,
            {
                "id": project_id,
                "name": name,
                "domain": domain,
                "config": json.dumps(config) if config else None,
                "user_id": user_id
            }
        )
        
        return {
            "id": project_id,
            "name": name,
            "domain": domain,
            "config": config,
            "user_id": user_id
        }
    
    async def get_user_projects(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all projects for a user."""
        return await self.execute_user_query(
            user_id,
            "SELECT * FROM projects ORDER BY created_at DESC"
        )
    
    async def get_project(self, user_id: str, project_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific project."""
        results = await self.execute_user_query(
            user_id,
            "SELECT * FROM projects WHERE id = :id",
            {"id": project_id}
        )
        return results[0] if results else None
    
    async def update_project(
        self,
        user_id: str,
        project_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """Update a project."""
        set_clauses = []
        params = {"id": project_id}
        
        for key, value in updates.items():
            if key != "id":
                set_clauses.append(f"{key} = :{key}")
                params[key] = json.dumps(value) if isinstance(value, dict) else value
        
        if not set_clauses:
            return False
        
        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        
        query = f"UPDATE projects SET {', '.join(set_clauses)} WHERE id = :id"
        
        await self.execute_user_query(user_id, query, params)
        return True
    
    async def delete_project(self, user_id: str, project_id: str) -> bool:
        """Delete a project."""
        await self.execute_user_query(
            user_id,
            "DELETE FROM projects WHERE id = :id",
            {"id": project_id}
        )
        return True
    
    # ========== Health Check ==========
    
    async def health_check(self) -> bool:
        """Check if Trailbase is healthy."""
        try:
            response = await self._client.get("/health")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Trailbase health check failed: {e}")
            return False


# Singleton instance
trailbase_service = TrailbaseService()
