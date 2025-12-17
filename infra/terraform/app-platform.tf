resource "digitalocean_app" "device_service" {
  count = var.apps_exist ? 0 : 1

  spec {
    name   = "campus-device-service-${var.environment}"
    region = var.region

    ingress {
      rule {
        match {
          path {
            prefix = "/"
          }
        }
        component {
          name = "device-service"
        }
      }
    }

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
  }
}

resource "digitalocean_app" "loan_service" {
  count = var.apps_exist ? 0 : 1

  spec {
    name   = "campus-loan-service-${var.environment}"
    region = var.region

    ingress {
      rule {
        match {
          path {
            prefix = "/"
          }
        }
        component {
          name = "loan-service"
        }
      }
    }

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

resource "digitalocean_project_resources" "main" {
  project = local.project_id
  resources = var.apps_exist ? [] : [
    digitalocean_app.device_service[0].urn,
    digitalocean_app.loan_service[0].urn
  ]
}
