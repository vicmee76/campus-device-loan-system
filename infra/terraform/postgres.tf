# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "campus-device-loan-db"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "14"
  delegated_subnet_id    = null
  private_dns_zone_id    = null
  administrator_login    = var.db_admin_user
  administrator_password = var.db_admin_password
  zone                   = "1"
  storage_mb             = 32768

  sku_name = "B_Standard_B1ms"

  # Backup retention (default is 7 days for Flexible Server)
  # Note: Backup configuration may vary by provider version

  maintenance_window {
    day_of_week  = 0
    start_hour   = 0
    start_minute = 0
  }

  tags = var.tags
}

# PostgreSQL Firewall Rule - Allow Azure Services
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"

  # Note: Database schema/migrations are handled by application, not Terraform
}

