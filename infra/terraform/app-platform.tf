resource "digitalocean_app" "platform" {
  spec {
    name   = "campus-device-loan-${var.environment}"
    region = var.region

    service {
      name               = "device-service"
      instance_count     = 1
      instance_size_slug = "basic-xxs"

      github {
        repo           = var.github_repo_url
        branch         = "main"
        deploy_on_push = true
      }

      build_command = "cd backend/device-service && npm install && npm run build"
      run_command   = "cd backend/device-service && npm start"
      source_dir    = "/"

      env {
        key   = "NODE_ENV"
        value = "production"
      }

      env {
        key   = "PORT"
        value = "7778"
      }

      env {
        key   = "DATABASE_URL"
        value = var.database_url
        type  = "SECRET"
      }

      http_port = 7778

      health_check {
        http_path             = "/health"
        initial_delay_seconds = 10
        period_seconds        = 10
        timeout_seconds       = 3
        success_threshold     = 1
        failure_threshold     = 3
      }

      routes {
        path = "/"
      }
    }

    service {
      name               = "loan-service"
      instance_count     = 1
      instance_size_slug = "basic-xxs"

      github {
        repo           = var.github_repo_url
        branch         = "main"
        deploy_on_push = true
      }

      build_command = "cd backend/loan-service && npm install && npm run build"
      run_command   = "cd backend/loan-service && npm start"
      source_dir    = "/"

      env {
        key   = "NODE_ENV"
        value = "production"
      }

      env {
        key   = "PORT"
        value = "7779"
      }

      env {
        key   = "DATABASE_URL"
        value = var.database_url
        type  = "SECRET"
      }

      http_port = 7779

      health_check {
        http_path             = "/health"
        initial_delay_seconds = 10
        period_seconds        = 10
        timeout_seconds       = 3
        success_threshold     = 1
        failure_threshold     = 3
      }

      routes {
        path = "/"
      }
    }
  }
}

resource "digitalocean_project_resources" "main" {
  project = digitalocean_project.main.id
  resources = [
    digitalocean_app.platform.urn
  ]
}
