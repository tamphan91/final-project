import * as React from 'react'
import Auth from '../auth/Auth'
import { Button, Segment } from 'semantic-ui-react'
import FeedExampleBasic from './FeedExampleBasic'

interface LogInProps {
  auth: Auth
}

interface LogInState {}

export class LogIn extends React.PureComponent<LogInProps, LogInState> {
  onLogin = () => {
    this.props.auth.login()
  }

  render() {
    return (
      <Segment basic textAlign="center">
        <h1>Please log in</h1>

        <Button onClick={this.onLogin} size="huge" color="olive">
          Log in
        </Button>
        {/* <FeedExampleBasic /> */}
      </Segment>
    )
  }
}
