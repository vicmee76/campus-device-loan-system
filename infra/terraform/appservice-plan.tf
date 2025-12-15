# App Service Plan for backend services
resource "azurerm_service_plan" "backend" {
  name                = "campus-device-loan-backend-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "B1"

  tags = var.tags
}

