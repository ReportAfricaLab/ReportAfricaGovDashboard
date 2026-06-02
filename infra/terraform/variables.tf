variable "aws_region" {
  default = "eu-west-1"
}

variable "project" {
  default = "reportafrica"
}

variable "environment" {
  default = "prod"
}

variable "db_name" {
  default = "reportafrica"
}

variable "db_username" {
  default = "reportafrica_admin"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "domain_name" {
  default = "reportafrica.com"
}

variable "ec2_key_name" {
  description = "SSH key pair name for EC2 access"
  type        = string
}
