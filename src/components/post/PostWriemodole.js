import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../../api';
import PostWriteModal from '../components/post/PostWriteModal';

// isOpen: modal visibility, onClose: close modal, onPostCreated: update feed after post creation
function PostWriteModal({ isOpen, onClose, onPostCreated }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return alert('Please enter some content.');

        setLoading(true);

        try {
            // API call: POST /posts (create post)
            const response = await api.post('/posts', { content });

            alert('Your post has been successfully created.');
            setContent(''); // reset input
            onClose(); // close modal
            onPostCreated(response.data); // update feed with new post data

        } catch (error) {
            console.error('Failed to create post:', error);
            alert(error.response?.data?.message || 'An error occurred while creating the post.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <h2>Create New Post</h2>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                </ModalHeader>
                <Form onSubmit={handleSubmit}>
                    <TextArea
                        placeholder="Share your day with us"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="6"
                        required
                    />
                    <PostButton type="submit" disabled={loading}>
                        {loading ? 'Posting...' : 'Post'}
                    </PostButton>
                </Form>
            </ModalContent>
        </ModalOverlay>
    );
}

export default PostWriteModal;

// (green / white theme)
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  h2 {
    color: #43a047;
    font-size: 20px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #757575;
  transition: color 0.2s;
  &:hover {
    color: #333;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 15px;
  border: 1px solid #c8e6c9;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  margin-bottom: 15px;
  &:focus {
    border-color: #66bb6a;
    outline: none;
  }
`;

const PostButton = styled.button`
  padding: 12px;
  background-color: #81c784;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover:not(:disabled) {
    background-color: #66bb6a;
  }
  &:disabled {
    background-color: #a5d6a7;
    cursor: not-allowed;
  }
`;
