import React from 'react';
import {Card, Progress, Tooltip, Typography } from 'antd';
import { DownloadOutlined, CloseCircleTwoTone, UploadOutlined, CloseOutlined } from '@ant-design/icons';
import { useDownloadManager } from './conexts/downloadConext';

export const DownloadFloatingPanel: React.FC = () => {
  const { downloads,rmItem } = useDownloadManager();

  if (downloads.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
       left: 24,
      width: 300,
      zIndex: 9999,
    }}>
      <Card title="Descargas" size="small" bordered>
        {downloads.map(download => (
          <div key={download.id} style={{ marginBottom: 10 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Tooltip title={download.name}>
                <Typography.Text ellipsis style={{ maxWidth: 200 }}>{download.name}</Typography.Text>
              </Tooltip>
              {download.status === 'done' ? (
                 <CloseOutlined style={{cursor:'pointer'}} onClick={() => {
                 rmItem(download.id)
                }} />
              ) : download.status === 'error' ? (
                <CloseCircleTwoTone twoToneColor="#ff4d4f" />
              ):download.status === 'uploading' ? (
                <UploadOutlined />
              ) : (
                <DownloadOutlined />
              )}
      
            </div>
            
            <Progress percent={download.progress} size="small" status={
              download.status === 'error' ? 'exception' :
              download.status === 'done' ? 'success' : 'active'
            } />
          </div>
        ))}
      </Card>
    </div>
  );
};