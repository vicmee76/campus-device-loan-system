resource "digitalocean_database_cluster" "postgres" {
  name       = var.db_cluster_name
  engine     = "pg"
  version    = var.db_engine_version
  region     = var.db_region
  size       = var.db_size
  node_count = var.db_node_count
}

locals {
  # Use DO's managed connection string (includes credentials). DO-managed Postgres requires TLS.
  database_url = digitalocean_database_cluster.postgres.uri
}


