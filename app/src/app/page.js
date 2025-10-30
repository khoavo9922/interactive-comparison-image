'use client';
import React, { useState } from 'react';
import { Layout, Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ReactCompareImage from 'react-compare-image';

const { Header, Content, Footer } = Layout;

const Home = () => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [file, setFile] = useState(null);

  const handleUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBeforeImage(e.target.result);
      setFile(file);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleGenerate = async () => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/process-image', {
      method: 'POST',
      body: formData,
    });

    const imageBlob = await res.blob();
    const reader = new FileReader();
    reader.onload = (e) => {
      setAfterImage(e.target.result);
    };
    reader.readAsDataURL(imageBlob);
  };

  return (
    <Layout className="min-h-screen">
      <Header className="text-center bg-gray-800">
        <h1 className="text-white">AI Image Comparison</h1>
      </Header>
      <Content className="p-12">
        <div className="max-w-4xl mx-auto">
          {beforeImage && afterImage ? (
            <ReactCompareImage
              leftImage={beforeImage}
              rightImage={afterImage}
            />
          ) : (
            <div className="border border-dashed border-gray-400 p-8 text-center">
              <p>Upload an image and click &quot;Generate&quot; to see the comparison.</p>
            </div>
          )}
        </div>
        <div className="mt-5 text-center">
          <Upload beforeUpload={handleUpload} showUploadList={false}>
            <Button icon={<UploadOutlined />}>Upload Image</Button>
          </Upload>
          <Button type="primary" onClick={handleGenerate} className="ml-2">
            Generate
          </Button>
        </div>
      </Content>
      <Footer className="text-center">
        AI Image Comparison ©2023 Created by Jules
      </Footer>
    </Layout>
  );
};

export default Home;
