import React, { Component } from 'react';
import axios from 'axios';
import { Form, Button, Input, Checkbox, message } from 'antd';
import './Login.css';

class Login extends Component {
  token;
  documentData;
  constructor(props) {
    super(props);
    this.state = {
      loadings: false,
      checked: false,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  onCheckboxChange = (e) => {
    this.setState({ ...this.state, checked: e.target.checked });
  };

  handleSubmit(event) {
    this.setState({ ...this.state, loadings: true });
    const { username, password } = event;
    axios
      .post('https://api.aflmonitoring.com/rest-auth/login/', {
        username: username,
        password: password,
      })
      .then((response) => {
        console.log(response);
        this.setState({ ...this.state, loadings: false });

        if (response && response.statusText === 'OK') {
          this.token = response.data.key;
          //if response is ok, then check if u want to store the token in localstorage or sessionstorage
          if (this.state.checked === true) {
            localStorage.setItem('Token', this.token);
          } else {
            sessionStorage.setItem('Token', this.token);
          }
          message.success('Login Successfull');
          this.props.toggleIsLoggedIn();
          this.props.history.push('/home');
        } else {
          console.log(response);
          this.setState({ ...this.state, loadings: false });
        }
      })
      .catch((error) => {
        this.setState({ ...this.state, loadings: false });
        if (error.response) {
          message.error(error.response.data.non_field_errors[0]);
        } else {
          message.error(error.message);
        }
      });
  }
  render() {
    const { loadings } = this.state;
    return (
      <div className="main-content">
        <div className="left-content">
          <h3 className="page-title">AFL Monitoring</h3>
        </div>
        <div className="right-content">
          <Form
            name="normal_login"
            className="login-form"
            onFinish={this.handleSubmit}>
            <h2>
              <b>LogIn</b>
            </h2>
            <h5>
              <b>Username</b>
            </h5>
            <Form.Item
              name="username"
              rules={[
                {
                  required: true,
                  message: 'Please input your username!',
                },
              ]}
              style={{ marginBottom: '10px' }}>
              <Input
                placeholder="Username"
                style={{ borderRadius: '7px', borderColor: '#707070' }}
              />
            </Form.Item>
            <h5>
              <b>Password</b>
            </h5>
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Please input your Password!',
                },
              ]}
              style={{ marginBottom: '0' }}>
              <Input.Password
                placeholder="Password"
                style={{ borderRadius: '7px', borderColor: '#707070' }}
              />
            </Form.Item>
            <Form.Item
              valuePropName="unchecked"
              style={{ marginBottom: '5px' }}>
              <Checkbox
                name="checked"
                checked={this.state.checked}
                onChange={this.onCheckboxChange}>
                <span style={{ fontWeight: 500 }}>Remember me</span>
              </Checkbox>
            </Form.Item>
            <Form.Item>
              <Form.Item style={{ marginBottom: '16px' }}>
                <Button
                  htmlType="submit"
                  loading={loadings}
                  className="login-btn"
                  style={{
                    background: '#3d0098',
                    borderColor: '#3d0098',
                    color: '#ffffff',
                    fontWeight: '500',
                  }}>
                  LOGIN
                </Button>
              </Form.Item>
              <a
                className="login-form-forgot"
                href="/"
                style={{ color: '#3d0098' }}>
                Forgot Password?
              </a>
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  }
}

export default Login;
