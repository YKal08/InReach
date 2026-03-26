output "vpc_id" {
  value = module.vpc.vpc_id
}

output "ecr_repository_urls" {
  value = { for k, v in module.ecr : k => v.repository_url }
}

output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}
