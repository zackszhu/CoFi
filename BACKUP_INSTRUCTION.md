# SQLite Database Backup Instructions

This guide provides multiple strategies for automatically backing up your SQLite database in the Docker environment.

## Overview

Your SQLite database is stored at `/app/data/cofi.db` inside the container, mounted to a Docker volume or host directory. These backup strategies ensure data safety and recovery options.

## Backup Strategies

### 1. Docker-based Automated Backup (Recommended)

Add this backup service to your `docker-compose.yml`:

```yaml
services:
  backup:
    image: alpine:latest
    volumes:
      - cofi_data:/data/source:ro
      - ./backups:/data/backup
    environment:
      - BACKUP_RETENTION_DAYS=7
    command: |
      sh -c "
        apk add --no-cache sqlite
        echo 'Starting backup service...'
        while true; do
          timestamp=$(date +%Y%m%d_%H%M%S)
          echo \"Creating backup: cofi_$${timestamp}.db\"
          sqlite3 /data/source/cofi.db ".backup /data/backup/cofi_$${timestamp}.db"
          
          # Clean old backups (keep last 7 days)
          find /data/backup -name '*.db' -mtime +$${BACKUP_RETENTION_DAYS:-7} -delete
          
          echo 'Backup completed. Next backup in 24 hours.'
          sleep 86400
        done
      "
    restart: unless-stopped
```

### 2. Application-level Backup API

Create a backup endpoint in your Next.js app:

```typescript
// src/app/api/backup/route.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { NextRequest } from 'next/server';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = '/app/data/backups';
    const backupPath = `${backupDir}/cofi_${timestamp}.db`;
    
    // Ensure backup directory exists
    await execAsync(`mkdir -p ${backupDir}`);
    
    // Create backup
    await execAsync(`sqlite3 /app/data/cofi.db ".backup ${backupPath}"`);
    
    return Response.json({ 
      success: true, 
      backup: backupPath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

Trigger backup via API:
```bash
curl -X POST http://localhost:3000/api/backup
```

### 3. Manual Backup Commands

#### Using Docker Exec
```bash
# Create backup directory
docker exec cofi-app mkdir -p /app/data/backups

# Create backup
docker exec cofi-app sqlite3 /app/data/cofi.db ".backup /app/data/backups/cofi_$(date +%Y%m%d_%H%M%S).db"

# List backups
docker exec cofi-app ls -la /app/data/backups/
```

#### Using Docker Volumes
```bash
# Backup entire volume to compressed archive
docker run --rm \
  -v cofi_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/cofi_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Restore from backup
docker run --rm \
  -v cofi_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/cofi_backup_20241201_120000.tar.gz -C /data
```

### 4. Cloud Storage Integration

#### AWS S3 Backup
```bash
# Install AWS CLI in backup container
# Add to backup service command:
aws s3 cp /data/backup/cofi_$(date +%Y%m%d_%H%M%S).db s3://your-bucket/cofi-backups/
```

#### Google Cloud Storage
```bash
# Add to backup service command:
gsutil cp /data/backup/cofi_$(date +%Y%m%d_%H%M%S).db gs://your-bucket/cofi-backups/
```

### 5. Cron-based Scheduled Backups

#### Host System Cron
Add to your host's crontab (`crontab -e`):
```bash
# Daily backup at 2 AM
0 2 * * * docker exec cofi-app sqlite3 /app/data/cofi.db ".backup /app/data/backups/cofi_$(date +\%Y\%m\%d).db"

# Weekly backup cleanup (keep last 4 weeks)
0 3 * * 0 find /path/to/backups -name 'cofi_*.db' -mtime +28 -delete
```

#### Docker Cron Container
```yaml
services:
  backup-cron:
    image: alpine:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./backup-script.sh:/backup-script.sh
    command: crond -f -l 2
```

## Setup Instructions

### Quick Start (Docker-based)

1. **Create backup directory**:
   ```bash
   mkdir -p backups
   ```

2. **Add backup service** to your `docker-compose.yml`:
   ```yaml
   services:
     app:
       # ... your existing app config
   
     backup:
     # ... backup service config from above
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

4. **Verify backups**:
   ```bash
   ls -la backups/
   ```

### Manual Setup

1. **Create backup directory**:
   ```bash
   mkdir -p backups
   ```

2. **Set up cron job**:
   ```bash
   # Edit crontab
   crontab -e
   
   # Add backup schedule
   0 2 * * * docker exec cofi-app sqlite3 /app/data/cofi.db ".backup /app/data/backups/cofi_$(date +\%Y\%m\%d).db"
   ```

## Recovery Instructions

### From SQLite Backup
```bash
# Stop the app
docker-compose down

# Restore from backup
docker run --rm \
  -v cofi_data:/data \
  -v $(pwd)/backups:/backup \
  alpine cp /backup/cofi_20241201_120000.db /data/cofi.db

# Restart the app
docker-compose up -d
```

### From Volume Archive
```bash
# Stop the app
docker-compose down

# Restore volume
docker run --rm \
  -v cofi_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/cofi_backup_20241201_120000.tar.gz -C /data

# Restart the app
docker-compose up -d
```

## Best Practices

### Retention Policy
- **Daily backups**: Keep for 7 days
- **Weekly backups**: Keep for 4 weeks
- **Monthly backups**: Keep for 12 months

### Security
- **Encrypt sensitive backups**:
  ```bash
  gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output cofi_backup.gpg cofi_backup.db
  ```

### Monitoring
- **Backup verification**:
  ```bash
  # Test backup integrity
  docker run --rm \
    -v cofi_data:/data \
    -v $(pwd)/backups:/backup \
    alpine sqlite3 /backup/cofi_20241201_120000.db "PRAGMA integrity_check;"
  ```

### Testing
- **Regular restore tests**: Monthly restore from backup
- **Backup validation**: Check backup file size and integrity
- **Disaster recovery**: Document and test full recovery procedure

## Troubleshooting

### Common Issues

1. **Permission denied**:
   ```bash
   # Fix permissions
   sudo chown -R $USER:$USER backups/
   ```

2. **Backup not running**:
   ```bash
   # Check backup container logs
   docker-compose logs backup
   ```

3. **Database locked**:
   ```bash
   # Ensure app is not writing during backup
   docker-compose exec app sqlite3 /app/data/cofi.db ".backup /app/data/backups/manual_backup.db"
   ```

## Configuration Examples

### Complete docker-compose.yml with backup
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - cofi_data:/app/data
    restart: unless-stopped

  backup:
    image: alpine:latest
    volumes:
      - cofi_data:/data/source:ro
      - ./backups:/data/backup
    environment:
      - BACKUP_RETENTION_DAYS=7
    command: |
      sh -c "
        apk add --no-cache sqlite
        while true; do
          timestamp=$(date +%Y%m%d_%H%M%S)
          sqlite3 /data/source/cofi.db ".backup /data/backup/cofi_$${timestamp}.db"
          find /data/backup -name '*.db' -mtime +$${BACKUP_RETENTION_DAYS:-7} -delete
          sleep 86400
        done
      "
    restart: unless-stopped

volumes:
  cofi_data:
```

This comprehensive guide provides everything needed to implement robust SQLite database backups for your Dockerized application.