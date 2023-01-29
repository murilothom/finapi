const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const customers = []

// Middleware
function verifyIfExistsAccountCpf(req, res, next) {
  const { cpf } = req.params

  const customer = customers.find(customer => customer.cpf === cpf)

  if (!customer) {
    return res.status(400).json({ error: 'Customer not found.' })
  }

  req.customer = customer

  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, currentValue) => {
    if (currentValue.type === 'credit') {
      return acc + currentValue.amount
    } else {
      return acc - currentValue.amount
    }
  }, 0)

  return balance
}

app.post('/account', (req, res) => {
  const { name, cpf } = req.body

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)

  if (customerAlreadyExists) {
    return res.status(400).json({ error: 'Customer already exists.' })
  }

  customers.push({
    id: uuidv4(),
    name,
    cpf,
    statement: []
  })
  
  return res.status(201).send()
})

app.get('/statement/:cpf', verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req

  return res.json(customer.statement)
})

app.post('/deposit/:cpf', verifyIfExistsAccountCpf, (req, res) => {
  const { description, amount } = req.body
  const { customer } = req

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()
})

app.post('/withdraw/:cpf', verifyIfExistsAccountCpf, (req, res) => {
  const { amount } = req.body
  const { customer } = req

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return res.status(400).json({ error: 'Insufficient funds.' })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()
})


app.get('/statement/:cpf/date', verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req
  const { date } = req.query

  const dateFormat = new Date(date + " 00:00")

  const statement = customer.statement.filter(statement => 
    statement.created_at.toDateString() === new Date(dateFormat).toDateString()
  )
 
  return res.json(statement)
})

app.listen(3333)
