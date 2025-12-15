# Device Service App Service
resource "azurerm_linux_web_app" "device_service" {
  name                = "campus-device-service-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_service_plan.backend.location
  service_plan_id     = azurerm_service_plan.backend.id

  site_config {
    application_stack {
      node_version = "18-lts"
    }

    always_on = false

    app_command_line = "node dist/index.js"
  }

  app_settings = {
    NODE_ENV                        = "production"
    PORT                            = "7778"
    DATABASE_URL                    = var.database_url
    JWT_EXPIRES_IN                  = "24h"
    CORS_ORIGIN                     = var.cors_origin
    NEXT_PUBLIC_DEVICE_SERVICE_URL  = "https://campus-device-service-${var.environment}.azurewebsites.net"
    NEXT_PUBLIC_LOAN_SERVICE_URL    = "https://campus-loan-service-${var.environment}.azurewebsites.net"
    LOG_LEVEL                       = "info"
  }

  connection_string {
    name  = "Database"
    type  = "PostgreSQL"
    value = var.database_url
  }

  tags = var.tags
}

# Application Insights for Device Service (optional monitoring)
resource "azurerm_application_insights" "device_service" {
  name                = "campus-device-service-insights-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "Node.JS"

  tags = var.tags
}

