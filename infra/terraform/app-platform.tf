# Backend App Platform - Single app with two services (device-service and loan-service)
resource "digitalocean_app" "backend" {
  spec {
    name   = "campus-device-loan-backend"
    region = var.region

    # Path-based routing: /device → device-service, /loan → loan-service
    ingress {
      rule {
        match {
          path {
            prefix = "/device"
          }
        }
        component {
          name = "device-service"
        }
      }

      rule {
        match {
          path {
            prefix = "/loan"
          }
        }
        component {
          name = "loan-service"
        }
      }
    }

    # Device Service
    service {
      name               = "device-service"
      instance_count     = 1
      instance_size_slug = "basic-xxs"
      source_dir         = "backend/device-service"

      github {
        repo           = var.github_repo_url
        branch         = "main"
        deploy_on_push = true
      }

      build_command = "npm install && npm run build"
      run_command   = "npm start"

      env {
        key   = "NODE_ENV"
        value = "production"
      }

      env {
        key   = "DATABASE_URL"
        value = var.database_url
        type  = "SECRET"
      }

      http_port = 8080

      health_check {
        http_path             = "/health"
        initial_delay_seconds = 10
        period_seconds        = 10
        timeout_seconds       = 3
        success_threshold     = 1
        failure_threshold     = 3
      }
    }

    # Loan Service
    service {
      name               = "loan-service"
      instance_count     = 1
      instance_size_slug = "basic-xxs"
      source_dir         = "backend/loan-service"

      github {
        repo           = var.github_repo_url
        branch         = "main"
        deploy_on_push = true
      }

      build_command = "npm install && npm run build"
      run_command   = "npm start"

      env {
        key   = "NODE_ENV"
        value = "production"
      }

      env {
        key   = "DATABASE_URL"
        value = var.database_url
        type  = "SECRET"
      }

      http_port = 8080

      health_check {
        http_path             = "/health"
        initial_delay_seconds = 10
        period_seconds        = 10
        timeout_seconds       = 3
        success_threshold     = 1
        failure_threshold     = 3
      }
    }
  }
}

# Attach backend and frontend apps to the project
resource "digitalocean_project_resources" "main" {
  project = local.project_id
  resources = [
    digitalocean_app.backend.urn,
    digitalocean_app.frontend.urn
  ]
}
