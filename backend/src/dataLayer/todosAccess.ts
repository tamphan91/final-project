import * as AWS from 'aws-sdk'
const AWSXRay = require('aws-xray-sdk')
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'

const logger = createLogger('TodosAccess')
const XAWS = AWSXRay.captureAWS(AWS)

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly attachmentBucket = process.env.ATTACHMENT_S3_BUCKET
  ) {}

  async getAllTodos(userId: String): Promise<TodoItem[]> {
    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async getTodo(todoId: string, userId: string): Promise<TodoItem> {
    const result = await this.docClient
      .get({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        }
      })
      .promise()

    return result.Item as TodoItem
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todo
      })
      .promise()

    return todo
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        }
      })
      .promise()

    return
  }

  async updateTodo(
    userId: string,
    todoId: string,
    todo: UpdateTodoRequest
  ): Promise<void> {
    logger.info('Starting update todo: ', todo)
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: { todoId, userId },
        UpdateExpression:
          'set #name = :updateName, #done = :doneStatus, #dueDate = :updateDueDate',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#done': 'done',
          '#dueDate': 'dueDate'
        },
        ExpressionAttributeValues: {
          ':updateName': todo.name,
          ':doneStatus': todo.done,
          ':updateDueDate': todo.dueDate
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()

    return
  }

  async updateTodoAttachment(userId: string, todoId: string): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: { todoId, userId },
        UpdateExpression: 'set #attachmentUrl = :attachmentUrl',
        ExpressionAttributeNames: { '#attachmentUrl': 'attachmentUrl' },
        ExpressionAttributeValues: {
          ':attachmentUrl': `https://${this.attachmentBucket}.s3.amazonaws.com/${todoId}`
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()
  }

  async removeTodoAttachment(userId: string, todoId: string): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: { todoId, userId },
        UpdateExpression: 'remove  #attachmentUrl',
        ExpressionAttributeNames: { '#attachmentUrl': 'attachmentUrl' },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()
  }

}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
