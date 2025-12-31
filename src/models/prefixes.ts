import mongoose, { Schema } from 'mongoose'

const reqString = {
  type: String,
  required: true,
}

const schema = new Schema({
  // Guild ID
  _id: reqString,
  prefix: reqString,
})

const name = 'spacecommands-prefixes'

export = mongoose.models[name] || mongoose.model(name, schema, name)
