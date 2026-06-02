# === ELASTICACHE SUBNET GROUP ===
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project}-redis-subnet"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

# === ELASTICACHE REDIS ===
resource "aws_elasticache_cluster" "redis" {
  cluster_id      = "${var.project}-redis"
  engine          = "redis"
  engine_version  = "7.1"
  node_type       = "cache.t3.micro" # Free tier
  num_cache_nodes = 1

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  port = 6379

  tags = { Name = "${var.project}-redis" }
}
