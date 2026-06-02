output "ec2_public_ip" {
  value       = aws_eip.api.public_ip
  description = "API server public IP — point api.reportafrica.com here"
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "RDS PostgreSQL endpoint (use as DATABASE_HOST)"
}

output "redis_endpoint" {
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
  description = "ElastiCache Redis endpoint (use as REDIS_HOST)"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.media.bucket
  description = "S3 bucket for media uploads"
}

output "ec2_ssh_command" {
  value       = "ssh -i <your-key>.pem ec2-user@${aws_eip.api.public_ip}"
  description = "SSH into API server"
}
