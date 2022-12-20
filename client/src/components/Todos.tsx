import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Segment
} from 'semantic-ui-react'

import {
  createTodo,
  deleteTodo,
  getTodos,
  patchTodo,
  removeTodoAttachment
} from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  todosFiltered: Todo[]
  newTodoName: string
  searchText: string
  loadingTodos: boolean
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    todosFiltered: [],
    newTodoName: '',
    searchText: '',
    loadingTodos: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  handleSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value) {
      this.setState({
        todosFiltered: this.state.todos.filter((todo) =>
          todo.name.includes(event.target.value)
        )
      })
    } else {
      this.setState({
        todosFiltered: this.state.todos
      })
    }
    this.setState({ searchText: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [newTodo, ...this.state.todos],
        todosFiltered: [newTodo, ...this.state.todosFiltered],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure?')) {
      try {
        await deleteTodo(this.props.auth.getIdToken(), todoId)
        this.setState({
          todos: this.state.todos.filter((todo) => todo.todoId !== todoId),
          todosFiltered: this.state.todosFiltered.filter(
            (todo) => todo.todoId !== todoId
          )
        })
      } catch {
        alert('Todo deletion failed')
      }
    }
  }

  onRemoveTodoAttachment = async (todoId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure?')) {
      try {
        await removeTodoAttachment(this.props.auth.getIdToken(), todoId)
        this.setState({
          todos: this.state.todos.map((todo) =>
            todo.todoId === todoId
              ? (() => {
                  delete todo.attachmentUrl
                  return todo
                })()
              : todo
          ),
          todosFiltered: this.state.todosFiltered.map((todo) =>
            todo.todoId === todoId
              ? (() => {
                  delete todo.attachmentUrl
                  return todo
                })()
              : todo
          )
        })
      } catch {
        alert('Todo detachment failed')
      }
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        }),
        todosFiltered: update(this.state.todosFiltered, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  clearSearchText = () => {
    this.setState({ searchText: '', todosFiltered: this.state.todos })
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        todosFiltered: todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }

  render() {
    return (
      <div>
        <Segment basic textAlign="center">
          <Header as="h1">TODOs</Header>

          {this.renderCreateTodoInput()}
        </Segment>
        {this.renderTodos()}
      </div>
    )
  }
  renderCreateTodoInput() {
    return (
      <>
        <Input
          icon={
            this.state.searchText.length > 0 ? (
              <Icon name="remove" onClick={this.clearSearchText} link />
            ) : (
              <Icon name="search" />
            )
          }
          value={this.state.searchText}
          placeholder="search..."
          onChange={this.handleSearchTextChange}
        />
        <Divider horizontal />
        <Grid.Row>
          <Grid.Column width={16}>
            <Input
              action={{
                disabled: this.state.newTodoName === '',
                color: this.state.newTodoName ? 'teal' : 'grey',
                labelPosition: 'left',
                icon: 'add',
                content: 'New task',
                onClick: this.onTodoCreate
              }}
              fluid
              value={this.state.newTodoName}
              actionPosition="left"
              placeholder="Enter task name..."
              onChange={this.handleNameChange}
            />
          </Grid.Column>
          <Grid.Column width={16}>
            <Divider />
          </Grid.Column>
        </Grid.Row>
      </>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        <Grid.Row>
          <Grid.Column width={2} verticalAlign="middle">
            <Header as="h4">DONE</Header>
          </Grid.Column>
          <Grid.Column width={3}>
            <Header as="h4">ATTACHMENT</Header>
          </Grid.Column>
          <Grid.Column width={7} verticalAlign="middle">
            <Header as="h4">NAME</Header>
          </Grid.Column>
          <Grid.Column width={2} floated="right" verticalAlign="middle">
            <Header as="h4">DUE-DATE</Header>
          </Grid.Column>
          <Grid.Column width={2} floated="right" verticalAlign="middle">
            <Header as="h4">ACTION</Header>
          </Grid.Column>
          <Grid.Column width={16}>
            <Divider />
          </Grid.Column>
        </Grid.Row>
        {this.state.todosFiltered.length === 0 && (
          <Grid.Row>
            <Grid.Column textAlign="center" width={16}>
              <Header disabled as="h3">
                {this.state.searchText.length > 0
                  ? `Could not find any TODOs for "${this.state.searchText}"`
                  : 'EMPTY'}
              </Header>
            </Grid.Column>
          </Grid.Row>
        )}
        {this.state.todosFiltered.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={2} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={3}>
                {todo.attachmentUrl && (
                  <>
                    <Image
                      style={{ filter: todo.done ? 'grayscale(100%)' : '' }}
                      src={todo.attachmentUrl}
                      size="small"
                      wrapped
                    />
                    {!todo.done && (
                      <Icon
                        link
                        onClick={() => this.onRemoveTodoAttachment(todo.todoId)}
                        name="remove circle"
                      />
                    )}
                  </>
                )}
              </Grid.Column>
              <Grid.Column width={7} verticalAlign="middle">
                <span
                  style={{ textDecoration: todo.done ? 'line-through' : '' }}
                >
                  {todo.name}
                </span>
              </Grid.Column>
              <Grid.Column width={2} floated="right" verticalAlign="middle">
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right" verticalAlign="middle">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="attach" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right" verticalAlign="middle">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {pos < this.state.todos.length - 1 && (
                <Grid.Column width={16}>
                  <Divider />
                </Grid.Column>
              )}
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
