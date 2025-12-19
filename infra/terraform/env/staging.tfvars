# Staging Environment Configuration

environment = "staging"
location     = "eastus"

# Existing App Service Plan name (shared across all environments)
app_service_plan_name = "asp-campus-loan-dev"

# Supabase connection (replace with your actual Supabase staging credentials)
supabase_url     = "https://your-project.supabase.co"
supabase_anon_key = "your-anon-key-here"
database_url     = "postgresql://postgres:[password]@[host]:5432/postgres?sslmode=require"

# Common tags
common_tags = {
  Project     = "CampusDeviceLoan"
  ManagedBy   = "Terraform"
  Environment = "staging"
}

