"""
Projects API Routes
Endpoints for managing user projects and deployments
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class CreateProjectRequest(BaseModel):
    """Request model for creating a project"""
    name: str
    description: Optional[str] = None
    language: str
    repo_type: str  # 'git' or 'upload'
    repo_url: Optional[str] = None
    branch: Optional[str] = "main"


class ProjectResponse(BaseModel):
    """Response model for a project"""
    id: str
    name: str
    description: Optional[str]
    language: str
    status: str
    repo_type: str
    repo_url: Optional[str]
    branch: Optional[str]
    image_name: Optional[str]
    created_at: str
    updated_at: str


# In-memory storage for projects (in production, use a database)
PROJECTS_DB: Dict[str, List[Dict[str, Any]]] = {}


def get_user_id(request) -> str:
    """Get user ID from request context"""
    return "current_user"


@router.post("", response_model=ProjectResponse)
async def create_project(project_request: CreateProjectRequest, request) -> ProjectResponse:
    """Create a new project"""
    user_id = get_user_id(request)
    
    # Validate project name
    if not project_request.name.replace('-', '').replace('_', '').isalnum():
        raise HTTPException(
            status_code=400,
            detail="Project name must contain only alphanumeric characters, hyphens, and underscores"
        )
    
    # Validate repo URL for git projects
    if project_request.repo_type == 'git' and not project_request.repo_url:
        raise HTTPException(
            status_code=400,
            detail="Repository URL is required for git projects"
        )
    
    # Create project record
    project_id = str(uuid.uuid4())[:8]
    image_name = f"{project_request.name}:latest"
    
    project_record = {
        "id": project_id,
        "name": project_request.name,
        "description": project_request.description or "",
        "language": project_request.language,
        "status": "created",
        "repo_type": project_request.repo_type,
        "repo_url": project_request.repo_url or "",
        "branch": project_request.branch or "main",
        "image_name": image_name,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Store in database
    if user_id not in PROJECTS_DB:
        PROJECTS_DB[user_id] = []
    
    PROJECTS_DB[user_id].append(project_record)
    
    logger.info(f"Project '{project_request.name}' created for user {user_id}")
    
    return ProjectResponse(**project_record)


@router.get("", response_model=List[ProjectResponse])
async def get_projects(request) -> List[ProjectResponse]:
    """Get all projects for the user"""
    user_id = get_user_id(request)
    
    if user_id not in PROJECTS_DB:
        return []
    
    return [ProjectResponse(**proj) for proj in PROJECTS_DB[user_id]]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, request) -> ProjectResponse:
    """Get specific project details"""
    user_id = get_user_id(request)
    
    if user_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for project in PROJECTS_DB[user_id]:
        if project["id"] == project_id:
            return ProjectResponse(**project)
    
    raise HTTPException(status_code=404, detail="Project not found")


@router.delete("/{project_id}")
async def delete_project(project_id: str, request) -> Dict[str, Any]:
    """Delete a project"""
    user_id = get_user_id(request)
    
    if user_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for i, project in enumerate(PROJECTS_DB[user_id]):
        if project["id"] == project_id:
            deleted_project = PROJECTS_DB[user_id].pop(i)
            logger.info(f"Project '{deleted_project['name']}' deleted for user {user_id}")
            return {
                "success": True,
                "message": f"Project '{deleted_project['name']}' deleted successfully",
                "project_id": project_id
            }
    
    raise HTTPException(status_code=404, detail="Project not found")


@router.post("/{project_id}/deploy")
async def deploy_project(project_id: str, request) -> Dict[str, Any]:
    """Deploy a project to the cluster"""
    user_id = get_user_id(request)
    
    if user_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = None
    for proj in PROJECTS_DB[user_id]:
        if proj["id"] == project_id:
            project = proj
            break
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Update project status
        project["status"] = "building"
        project["updated_at"] = datetime.utcnow().isoformat()
        
        # In a real implementation, this would:
        # 1. Clone the git repo or extract uploaded files
        # 2. Generate Dockerfile if not present
        # 3. Build the Docker image
        # 4. Deploy to Kubernetes
        
        # For demo, we'll simulate it
        logger.info(f"Deploying project '{project['name']}' (ID: {project_id})")
        
        project["status"] = "active"
        project["updated_at"] = datetime.utcnow().isoformat()
        
        return {
            "success": True,
            "message": f"Project '{project['name']}' deployed successfully!",
            "project_id": project_id,
            "image_name": project["image_name"],
            "status": "active"
        }
    except Exception as e:
        project["status"] = "failed"
        project["updated_at"] = datetime.utcnow().isoformat()
        logger.error(f"Failed to deploy project {project_id}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to deploy project: {str(e)}"
        )


@router.post("/{project_id}/build")
async def build_project(project_id: str, request) -> Dict[str, Any]:
    """Build Docker image for a project"""
    user_id = get_user_id(request)
    
    if user_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = None
    for proj in PROJECTS_DB[user_id]:
        if proj["id"] == project_id:
            project = proj
            break
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        project["status"] = "building"
        project["updated_at"] = datetime.utcnow().isoformat()
        
        # In real implementation, build Docker image
        
        project["status"] = "built"
        
        return {
            "success": True,
            "message": f"Image '{project['image_name']}' built successfully",
            "image_name": project["image_name"]
        }
    except Exception as e:
        project["status"] = "failed"
        raise HTTPException(
            status_code=400,
            detail=f"Failed to build project: {str(e)}"
        )


@router.get("/{project_id}/logs")
async def get_project_logs(project_id: str, request) -> Dict[str, Any]:
    """Get build/deployment logs for a project"""
    user_id = get_user_id(request)
    
    if user_id not in PROJECTS_DB:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = None
    for proj in PROJECTS_DB[user_id]:
        if proj["id"] == project_id:
            project = proj
            break
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Return demo logs
    return {
        "project_id": project_id,
        "logs": [
            "Cloning repository...",
            "Repository cloned successfully",
            "Detecting project language: nodejs",
            "Generating Dockerfile...",
            "Building Docker image...",
            "Step 1/10 : FROM node:18-alpine",
            "Step 2/10 : WORKDIR /app",
            "Step 3/10 : COPY package*.json ./",
            "Step 4/10 : RUN npm install",
            "Step 5/10 : COPY . .",
            "Step 6/10 : EXPOSE 3000",
            "Step 7/10 : CMD [\"npm\", \"start\"]",
            "Build completed successfully!",
            "Image pushed to registry: " + project["image_name"],
        ]
    }
