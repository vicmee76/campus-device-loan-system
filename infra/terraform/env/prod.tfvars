environment = "prod"

# You can choose different regions for prod if desired.
app_region = "nyc"
db_region  = "lon1"

# Base names (Terraform appends "-prod" automatically)
device_app_name   = "device-service"
loan_app_name     = "loan-service"
frontend_app_name = "campus-frontend"
do_project_name   = "campus-device-loan"
db_cluster_name   = "campus-device-loan-db"

github_repo   = "vicmee76/campus-device-loan-system"
github_branch = "main"

# Keep false so DO doesn't auto-deploy on pushes; GitHub Actions controls deployments.
deploy_on_push = false


