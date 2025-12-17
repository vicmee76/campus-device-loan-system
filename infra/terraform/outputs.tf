output "backend_app_url" {
  description = "Backend App Platform live URL"
  value       = digitalocean_app.platform.live_url
}

output "device_service_name" {
  description = "Device Service name"
  value       = "device-service"
}

output "loan_service_name" {
  description = "Loan Service name"
  value       = "loan-service"
}

output "app_platform_urn" {
  description = "App Platform URN"
  value       = digitalocean_app.platform.urn
}
