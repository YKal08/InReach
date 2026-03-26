variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
}

variable "ecr_repositories" {
  description = "List of ECR repository names"
  type        = list(string)
}

variable "db_name" {
  description = "RDS database name"
  type        = string
}

variable "db_username" {
  description = "RDS master username"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS"
  type        = string
}

variable "eks_node_instance_types" {
  description = "Instance types for EKS node group"
  type        = list(string)
}
