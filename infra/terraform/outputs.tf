output "device_service_app_id" {
  description = "Device Service App ID"
  value       = var.apps_exist ? null : digitalocean_app.device_service[0].id
}

output "loan_service_app_id" {
  description = "Loan Service App ID"
  value       = var.apps_exist ? null : digitalocean_app.loan_service[0].id
}

output "device_service_url" {
  description = "Device Service URL"
  value       = var.apps_exist ? null : digitalocean_app.device_service[0].live_url
}

output "loan_service_url" {
  description = "Loan Service URL"
  value       = var.apps_exist ? null : digitalocean_app.loan_service[0].live_url
}
