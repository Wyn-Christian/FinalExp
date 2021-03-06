import inquirer from "inquirer"
import usbDetect from "usb-detection"
import fs from "fs"

// Designs
function displayStartUp() {
  console.clear()

  console.log(
    "                               ...Please plug/replug the flashdrive/s..."
  )
}
function displayEject() {
  console.log(
    "                   ****************** Please unplug the flash drive *******************"
  )
  console.log(
    "                   **************** Thank you for using ATM Flash drive! **************"
  )
}
function displayNewDevice() {
  console.clear()
  console.log(
    "                   *************** Detected new device! ***************"
  )
  console.log("                                   Please Sign-Up First")
}
function displayUnexpectedError() {
  console.clear()
  console.log(
    "                               ...Oops, unexpected event happened..."
  )
}

function displayReceipt(amount, currentMoney) {
  console.log("\t\t Here is the receipt, thank you!")
  console.log(`\t\t Amount taken: ${amount}`)
  console.log(`\t\t Current Amount in ATM flashdrive: ${currentMoney}`)

  let d = new Date()
  console.log(`\t\t Date occured: ${d.toUTCString()}`)
}

function optionPrompt(dir) {
  inquirer
    .prompt([
      {
        type: "rawlist",
        name: "option",
        message:
          "                   *************** WELCOME TO ATM FLASHDRIVE! *************** \nOption: ",
        choices: [
          new inquirer.Separator(),
          "Withdraw",
          "Check balance",
          "Eject",
          new inquirer.Separator(),
        ],
      },
    ])
    .then((answers) => {
      switch (answers["option"]) {
        case "Withdraw":
          withdrawPrompt(dir)
          break
        case "Check balance":
          checkBalPrompt(dir)
          break
        default:
          eject()
          break
      }
    })
}

function signUpPrompt(dir) {
  let password,
    currentMoney,
    isDone = 0

  inquirer
    .prompt([
      {
        name: "sign-up",
        type: "password",
        message: "Please, enter your 4-PIN password: ",
        mask: "*",
        validate(value) {
          if (value.length != 4) return "Please enter only 4 length password"
          else return true
        },
        loop: true,
      },
      {
        name: "current money",
        type: "input",
        message: "What's the current amount money in the flashdrive?",
        validate(v) {
          if (v.match(/[a-z]|[A-Z]/i)) return "Please enter valid input"
          return true
        },
        loop: true,
      },
    ])
    .then((answers) => {
      password = answers["sign-up"]
      currentMoney = answers["current money"]
      console.log(
        `                                  SIGN UP COMPLETED! \n\t\t\t\t       WELCOME!`
      )
      console.clear()

      fs.writeFile(
        dir,
        `${currentMoney} ${password}`,
        { flag: "w+" },
        (err) => {
          if (err) {
            console.error(err)
            return
          }
          //done!
        }
      )

      isDone = 1

      if (isDone) optionPrompt(dir)
    })
}

function withdrawPrompt(dir) {
  let data = fs.readFileSync(dir, "utf8", (err) => console.log(err))
  data = data.split(" ")

  inquirer
    .prompt([
      {
        type: "input",
        name: "amount",
        message: "Amount of money to withdraw: ",
        validate(ans) {
          if (ans.match(/[a-z]|[A-Z]/i)) return "Please enter valid input"
          return true
        },
        loop: true,
      },
      {
        type: "confirm",
        name: "confirmation",
        message: "Are you sure?",
      },
      {
        type: "password",
        name: "verify",
        message: "Enter 4-PIN verification: ",
        mask: "*",
        when(answer) {
          return answer.confirmation
        },
        validate(ans) {
          if (ans != data[1]) return "Wrong PIN input, try again..."
          return true
        },
      },
    ])
    .then((ans) => {
      if (ans.confirmation) {
        data[0] = Number(data[0]) - ans["amount"]

        // Design: Resibo ng user
        displayReceipt(ans.amount, data[0])

        fs.writeFileSync(
          dir,
          `${data[0]} ${data[1]}`,
          { flag: "w+" },
          (err) => {
            if (err) {
              console.error(err)
              return
            }
            //done!
          }
        )
      }

      inquirer
        .prompt([
          {
            type: "list",
            name: "exit",
            message: "Option: ",
            choices: ["Return", "Eject"],
          },
        ])
        .then((ans) => {
          if (ans.exit == "Return") optionPrompt(dir)
          else {
            eject()
          }
        })
    })
}

function checkBalPrompt(dir) {
  let data = fs.readFileSync(dir, "utf8", (err) => console.log(err))
  data = data.split(" ")

  inquirer
    .prompt([
      {
        type: "confirm",
        name: "confirmation",
        message: "Are you sure you want to check your balance?",
      },
      {
        type: "password",
        name: "verify",
        message: "Enter the 4-PIN for verification: ",
        mask: "*",
        when(answer) {
          return answer.confirmation
        },
        validate(ans) {
          if (ans != data[1]) return "Wrong PIN input, try again..."
          return true
        },
      },
    ])
    .then((ans) => {
      console.log("Here is the current amount of money: " + data[0])

      inquirer
        .prompt([
          {
            type: "list",
            name: "exit",
            message: "Option: ",
            choices: ["Return", "Eject"],
          },
        ])
        .then((ans) => {
          if (ans.exit == "Return") optionPrompt(dir)
          else {
            eject()
          }
        })
    })
}

function eject() {
  inProcess = false

  // Design: kapag tapos na ang user mag-process sa atm
  displayEject()
}

function checkDirectory(dir = "") {
  inProcess = true
  let isNewUser = false
  if (dir) {
    try {
      fs.readFileSync(dir, "utf8", (err) => {})
    } catch (error) {
      isNewUser = true

      // Design: notification para sa mga bagong users
      displayNewDevice()
    }

    if (isNewUser) {
      signUpPrompt(dir)
    } else {
      optionPrompt(dir)
    }
  } else {
    // Design: gawa kayo ng prompt for start-up (1)
    displayStartUp()
  }
}

// ---------QUEUE FUNCTIONS-------

function Queue() {
  this.elements = []
}

Queue.prototype.enqueue = function (e) {
  this.elements.push(e)
}

Queue.prototype.dequeue = function (i = 0) {
  return i ? this.elements.splice(i, 1) : this.elements.shift()
}

Queue.prototype.isEmpty = function () {
  return this.elements.length == 0
}

Queue.prototype.peek = function () {
  return !this.isEmpty() ? this.elements[0] : undefined
}

Queue.prototype.length = function () {
  return this.elements.length
}

Queue.prototype.seek = function (d) {
  let i = 0
  for (let device of this.elements) {
    if (d.vendorId == device.vendorId && d.productId == device.productId)
      return i
    i++
  }
  return -1
}

// ---------MAIN PROGRAM-------
let QFlashDrive = new Queue()
let currentDirectory,
  inProcess = false

usbDetect.startMonitoring()

// Design: gawa kayo ng prompt for start-up (1)
displayStartUp()

usbDetect.on("add", function (device) {
  if (QFlashDrive.isEmpty()) {
    currentDirectory = `./database/${device.vendorId}-${device.productId}.txt`
    checkDirectory(currentDirectory)
  }
  QFlashDrive.enqueue(device)
})

usbDetect.on("remove", function (device) {
  let index = QFlashDrive.seek(device)
  QFlashDrive.dequeue(index)

  if (index == 0 && inProcess) {
    inProcess = false

    // Design: prompt user kapag nag-eject sila habang nasa process palang
    displayUnexpectedError()
  }

  if (!inProcess) {
    currentDirectory = !QFlashDrive.isEmpty()
      ? `./database/${QFlashDrive.elements[0].vendorId}-${QFlashDrive.elements[0].productId}.txt`
      : null
    checkDirectory(currentDirectory)
  }
})
