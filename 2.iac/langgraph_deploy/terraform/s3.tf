# S3 Bucket for PRD files
resource "aws_s3_bucket" "prd_files" {
  bucket = "${var.project_name}-prd-files-${random_string.bucket_suffix.result}"
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "prd_files" {
  bucket = aws_s3_bucket.prd_files.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "prd_files" {
  bucket = aws_s3_bucket.prd_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "prd_files" {
  bucket = aws_s3_bucket.prd_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
