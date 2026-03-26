module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = var.eks_cluster_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true
  bootstrap_self_managed_addons  = false

  enable_cluster_creator_admin_permissions = true

  eks_managed_node_groups = {
    default = {
      name = "${var.project_name}-${var.environment}-ng"

      instance_types = var.eks_node_instance_types

      min_size     = 1
      max_size     = 2
      desired_size = 1

      capacity_type = "ON_DEMAND"
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
