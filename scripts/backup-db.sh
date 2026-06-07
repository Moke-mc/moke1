#!/bin/bash

# ===========================================
# 教培教务系统 - 数据库备份脚本
# ===========================================

# 配置
DB_PATH="./data/database.sqlite"
BACKUP_DIR="./data/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="database_${DATE}.sqlite"

# 日志函数
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"
}

# 创建备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    log_info "创建备份目录: $BACKUP_DIR"
fi

# 检查数据库文件
if [ ! -f "$DB_PATH" ]; then
    log_error "数据库文件不存在: $DB_PATH"
    exit 1
fi

# 备份数据库
log_info "开始备份数据库..."
cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_NAME"

if [ $? -eq 0 ]; then
    log_info "备份成功: $BACKUP_DIR/$BACKUP_NAME"
else
    log_error "备份失败"
    exit 1
fi

# 压缩备份
cd "$BACKUP_DIR"
tar -czvf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm "$BACKUP_NAME"

log_info "备份压缩完成: ${BACKUP_NAME}.tar.gz"

# 清理旧备份（保留最近30天）
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
log_info "清理旧备份完成（保留最近30天）"

# 显示备份列表
echo ""
echo "备份列表（前10个）:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -10

echo ""
log_info "备份完成！"
