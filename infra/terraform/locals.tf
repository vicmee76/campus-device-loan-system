locals {
  # Environment suffix used in resource names, e.g. "dev" or "prod"
  env_suffix = var.environment

  # Consistent naming across all resources
  device_app_full_name   = "${var.device_app_name}-${local.env_suffix}"
  loan_app_full_name     = "${var.loan_app_name}-${local.env_suffix}"
  frontend_app_full_name = "${var.frontend_app_name}-${local.env_suffix}"
  db_cluster_full_name   = "${var.db_cluster_name}-${local.env_suffix}"
  do_project_full_name   = "${var.do_project_name}-${local.env_suffix}"

  # DigitalOcean "project.environment" is one of: Development, Staging, Production
  do_project_environment = (
    var.environment == "prod" || var.environment == "production"
    ) ? "Production" : (
    var.environment == "staging"
  ) ? "Staging" : "Development"
}


