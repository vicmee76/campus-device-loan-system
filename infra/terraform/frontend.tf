# Static Web App for Frontend
resource "azurerm_static_web_app" "frontend" {
  name                = "campus-device-loan-frontend-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku_tier            = "Free"
  sku_size            = "Free"

  tags = var.tags
}

# Static Web App Custom Domain (disabled by default - uncomment and configure if needed)
# resource "azurerm_static_web_app_custom_domain" "frontend" {
#   static_web_app_id = azurerm_static_web_app.frontend.id
#   domain_name       = "example.com"
#   validation_type   = "dns-txt-token"  # or "cname-delegation"
# }

