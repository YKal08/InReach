module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.project_name}-${var.environment}"

  engine               = "postgres"
  engine_version       = "16"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 50

  db_name  = var.db_name
  username = var.db_username
  port     = 5432

  manage_master_user_password = true

  multi_az               = false
  vpc_security_group_ids = [module.rds_sg.security_group_id]

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  create_db_subnet_group = true
  subnet_ids             = module.vpc.private_subnets

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

module "rds_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-${var.environment}-rds"
  description = "Security group for RDS"
  vpc_id      = module.vpc.vpc_id

  ingress_with_cidr_blocks = [
    {
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = var.vpc_cidr
      description = "PostgreSQL access from VPC"
    }
  ]

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
