resource "digitalocean_database_cluster" "postgres" {
  name       = var.db_cluster_name
  engine     = "pg"
  version    = var.db_engine_version
  region     = var.region
  size       = var.db_size
  node_count = var.db_node_count
}

resource "digitalocean_database_db" "app" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = var.db_name
}

resource "digitalocean_database_user" "app" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = var.db_user
}

# NOTE: For dev convenience, allow public access so GitHub Actions + App Platform can connect.
# Tighten this in staging/prod (e.g. via VPC + trusted sources) if needed.
resource "digitalocean_database_firewall" "public" {
  count      = var.db_allow_public_access ? 1 : 0
  cluster_id = digitalocean_database_cluster.postgres.id

  rule {
    type  = "ip_addr"
    value = "0.0.0.0/0"
  }

  rule {
    type  = "ip_addr"
    value = "::/0"
  }
}

locals {
  # Construct an application connection string using the app user and DB name.
  # DO-managed Postgres requires TLS; sslmode=require is the standard setting.
  database_url = "postgresql://${digitalocean_database_user.app.name}:${urlencode(digitalocean_database_user.app.password)}@${digitalocean_database_cluster.postgres.host}:${digitalocean_database_cluster.postgres.port}/${digitalocean_database_db.app.name}?sslmode=require"
}


