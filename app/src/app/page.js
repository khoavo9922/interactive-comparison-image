'use client';
import React, { useState } from 'react';
import { Layout, Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ReactCompareImage from 'react-compare-image';

const { Header, Content, Footer } = Layout;

const Home = () => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);

  const handleUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBeforeImage(e.target.result);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleGenerate = () => {
    if (!beforeImage) {
      return;
    }

    const img = new Image();
    img.src = beforeImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
      }
      ctx.putImageData(imageData, 0, 0);
      setAfterImage(canvas.toDataURL());
    };
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
              <p>Upload an image and click "Generate" to see the comparison.</p>
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
