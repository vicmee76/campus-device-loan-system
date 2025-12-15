output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
}

output "postgresql_server_name" {
  description = "Name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "postgresql_server_fqdn" {
  description = "FQDN of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "postgresql_database_name" {
  description = "Name of the PostgreSQL database"
  value       = azurerm_postgresql_flexible_server_database.main.name
}

output "device_service_hostname" {
  description = "Hostname of the Device Service"
  value       = azurerm_linux_web_app.device_service.default_hostname
}

output "device_service_url" {
  description = "URL of the Device Service"
  value       = "https://${azurerm_linux_web_app.device_service.default_hostname}"
}

output "loan_service_hostname" {
  description = "Hostname of the Loan Service"
  value       = azurerm_linux_web_app.loan_service.default_hostname
}

output "loan_service_url" {
  description = "URL of the Loan Service"
  value       = "https://${azurerm_linux_web_app.loan_service.default_hostname}"
}

output "frontend_hostname" {
  description = "Hostname of the Frontend Static Web App"
  value       = azurerm_static_web_app.frontend.default_host_name
}

output "frontend_url" {
  description = "URL of the Frontend Static Web App"
  value       = "https://${azurerm_static_web_app.frontend.default_host_name}"
}

output "device_service_application_insights_id" {
  description = "Application Insights ID for Device Service"
  value       = azurerm_application_insights.device_service.id
}

output "loan_service_application_insights_id" {
  description = "Application Insights ID for Loan Service"
  value       = azurerm_application_insights.loan_service.id
}

