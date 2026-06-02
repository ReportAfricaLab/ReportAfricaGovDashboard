# === RDS SUBNET GROUP ===
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnet"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = { Name = "${var.project}-db-subnet" }
}

# === RDS POSTGRESQL ===
resource "aws_db_instance" "postgres" {
  identifier     = "${var.project}-db"
  engine         = "postgres"
  engine_version = "16.3"
  instance_class = "db.t3.micro" # Free tier

  allocated_storage     = 20
  max_allocated_storage = 100 # Auto-scale storage
  storage_type          = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az            = false # Single-AZ for free tier
  publicly_accessible = false
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project}-db-final-snapshot"

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Enable PostGIS after creation via SQL:
  # CREATE EXTENSION postgis;

  tags = { Name = "${var.project}-db" }
}
