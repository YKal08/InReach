region       = "eu-central-1"
environment  = "prod"
project_name = "hacktues12"

# VPC
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
availability_zones   = ["eu-central-1a", "eu-central-1b"]

# ECR
ecr_repositories = ["frontend", "backend"]

# RDS
db_name          = "appdb"
db_username      = "dbadmin"
db_instance_class = "db.t4g.micro"

# EKS
eks_cluster_version     = "1.35"
eks_node_instance_types = ["t3.medium"]

# ArgoCD
argocd_hostname = "argocd.hacktues.elsys.itgix.eu"
