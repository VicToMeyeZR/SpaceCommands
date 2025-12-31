import mongoose, { Schema } from 'mongoose'

const reqString = {
  type: String,
  required: true,
}

const schema = new Schema({
  guildId: reqString,
  command: reqString,
})

const name = 'spacecommands-disabled-commands'

export = mongoose.models[name] || mongoose.model(name, schema, name)
