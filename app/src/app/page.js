'use client';
import React, { useState } from 'react';
import { Layout, Button, Upload, Input, Spin, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ReactCompareImage from 'react-compare-image';

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;

const Home = () => {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBeforeImage(e.target.result);
      setAfterImage(null); // Reset after image on new upload
      setFile(file);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleGenerate = async () => {
    if (!file) {
      message.error('Please upload an image first.');
      return;
    }
    if (!prompt.trim()) {
      message.error('Please enter a prompt to modify the image.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', prompt);

    try {
      const res = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
      }

      const imageBlob = await res.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        setAfterImage(e.target.result);
      };
      reader.readAsDataURL(imageBlob);
    } catch (error) {
      console.error('Failed to process image:', error);
      message.error('Failed to generate the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="text-center bg-gray-800 shadow-md">
        <h1 className="text-2xl text-white font-semibold">AI Image Editor</h1>
      </Header>
      <Content className="p-4 sm:p-8 md:p-12">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-700">Image Comparison</h2>
            <p className="text-gray-500">Upload an image, describe the change, and see the result.</p>
          </div>

          <Spin spinning={loading} tip="Generating your image..." size="large">
            <div className="w-full h-auto border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6 flex justify-center items-center min-h-[300px]">
              {beforeImage && afterImage ? (
                <ReactCompareImage
                  leftImage={beforeImage}
                  rightImage={afterImage}
                />
              ) : beforeImage ? (
                <img src={beforeImage} alt="Uploaded" className="max-w-full max-h-[400px] rounded-md" />
              ) : (
                <p className="text-gray-400">Your image comparison will appear here.</p>
              )}
            </div>
          </Spin>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
              <TextArea
                rows={2}
                placeholder="Describe the changes you want, e.g., 'make the cat wear a party hat'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full"
                disabled={loading}
              />
            </div>
            <div className="flex justify-around md:justify-end gap-x-2">
              <Upload beforeUpload={handleUpload} showUploadList={false} disabled={loading}>
                <Button icon={<UploadOutlined />} disabled={loading}>
                  Choose Image
                </Button>
              </Upload>
              <Button type="primary" onClick={handleGenerate} loading={loading} disabled={loading}>
                Generate
              </Button>
            </div>
          </div>
        </div>
      </Content>
      <Footer className="text-center text-gray-500 bg-gray-100">
        AI Image Comparison ©{new Date().getFullYear()} Created by Jules
      </Footer>
    </Layout>
  );
};

export default Home;
