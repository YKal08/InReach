module "ecr" {
  source   = "terraform-aws-modules/ecr/aws"
  version  = "~> 2.0"
  for_each = toset(var.ecr_repositories)

  repository_name                 = "${var.project_name}-${each.value}"
  repository_image_tag_mutability = "MUTABLE"

  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}