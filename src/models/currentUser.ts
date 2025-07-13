export class CurrentUser {
  name: string
  phone: string
  id: string
  photo: string

  constructor(data: CurrentUser) {
    this.name = data.name
    this.phone = data.phone
    this.id = data.id
    this.phone = data.phone
    this.photo = data.photo
  }
}
