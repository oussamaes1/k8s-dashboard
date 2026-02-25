"""
Registry API Routes
Endpoints for managing container images and registries
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()


class UploadImageRequest(BaseModel):
    """Request model for uploading a container image"""
    image_name: str
    image_tag: str = "latest"
    description: Optional[str] = None
    dockerfile: str


class ContainerImageResponse(BaseModel):
    """Response model for container image"""
    id: str
    image_name: str
    image_tag: str
    full_name: str
    description: Optional[str]
    dockerfile: str
    created_at: str
    size: Optional[str] = None


# In-memory storage for user images (in production, use a database)
USER_IMAGES_DB: Dict[str, List[Dict[str, Any]]] = {}


def get_user_id(request) -> str:
    """Get user ID from request context (for demo, use username from auth)"""
    # In production, this would come from the authenticated user
    return "current_user"


@router.post("/upload-image", response_model=ContainerImageResponse)
async def upload_image(image_request: UploadImageRequest) -> ContainerImageResponse:
    """Upload a new container image"""
    user_id = "current_user"
    
    # Validate image name
    if not image_request.image_name.replace('-', '').replace('_', '').isalnum():
        raise HTTPException(
            status_code=400,
            detail="Image name must contain only alphanumeric characters, hyphens, and underscores"
        )
    
    # Validate Dockerfile
    if not image_request.dockerfile.strip().startswith("FROM"):
        raise HTTPException(
            status_code=400,
            detail="Dockerfile must start with 'FROM' instruction"
        )
    
    # Create image record
    image_id = str(uuid.uuid4())[:8]
    full_name = f"{image_request.image_name}:{image_request.image_tag}"
    
    image_record = {
        "id": image_id,
        "image_name": image_request.image_name,
        "image_tag": image_request.image_tag,
        "full_name": full_name,
        "description": image_request.description or "",
        "dockerfile": image_request.dockerfile,
        "created_at": datetime.utcnow().isoformat(),
        "size": None
    }
    
    # Store in database
    if user_id not in USER_IMAGES_DB:
        USER_IMAGES_DB[user_id] = []
    
    USER_IMAGES_DB[user_id].append(image_record)
    
    return ContainerImageResponse(**image_record)


@router.get("/images", response_model=List[ContainerImageResponse])
async def get_images() -> List[ContainerImageResponse]:
    """Get all container images uploaded by the user"""
    user_id = "current_user"
    
    if user_id not in USER_IMAGES_DB:
        return []
    
    return [ContainerImageResponse(**img) for img in USER_IMAGES_DB[user_id]]


@router.get("/images/{image_id}", response_model=ContainerImageResponse)
async def get_image(image_id: str) -> ContainerImageResponse:
    """Get specific container image details"""
    user_id = "current_user"
    
    if user_id not in USER_IMAGES_DB:
        raise HTTPException(status_code=404, detail="Image not found")
    
    for image in USER_IMAGES_DB[user_id]:
        if image["id"] == image_id:
            return ContainerImageResponse(**image)
    
    raise HTTPException(status_code=404, detail="Image not found")


@router.delete("/images/{image_id}")
async def delete_image(image_id: str) -> Dict[str, Any]:
    """Delete a container image"""
    user_id = "current_user"
    
    if user_id not in USER_IMAGES_DB:
        raise HTTPException(status_code=404, detail="Image not found")
    
    for i, image in enumerate(USER_IMAGES_DB[user_id]):
        if image["id"] == image_id:
            deleted_image = USER_IMAGES_DB[user_id].pop(i)
            return {
                "success": True,
                "message": f"Image '{deleted_image['full_name']}' deleted successfully",
                "image_id": image_id
            }
    
    raise HTTPException(status_code=404, detail="Image not found")


@router.get("/public-registries", response_model=List[Dict[str, Any]])
async def get_public_registries() -> List[Dict[str, Any]]:
    """Get list of popular public registries"""
    return [
        {
            "name": "Docker Hub",
            "url": "https://hub.docker.com",
            "description": "Official Docker image repository",
            "examples": ["nginx", "python", "nodejs", "postgres", "mongodb"]
        },
        {
            "name": "GitHub Container Registry",
            "url": "https://ghcr.io",
            "description": "GitHub's container registry service",
            "examples": ["your-username/your-image"]
        },
        {
            "name": "Amazon ECR",
            "url": "https://aws.amazon.com/ecr",
            "description": "AWS Elastic Container Registry",
            "examples": ["123456789.dkr.ecr.us-east-1.amazonaws.com/image"]
        },
        {
            "name": "Google Container Registry",
            "url": "https://cloud.google.com/container-registry",
            "description": "Google Cloud's container registry",
            "examples": ["gcr.io/project-id/image"]
        }
    ]
