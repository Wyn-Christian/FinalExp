import inquirer from "inquirer"
import usbDetect from "usb-detection"
import fs from "fs"

function optionPrompt(dir) {
  inquirer
    .prompt([
      {
        type: "rawlist",
        name: "option",
        message: "Welcome to ATM flashdrive: ",
        choices: [
          "Withdraw",
          "Check balance",
          new inquirer.Separator(),
          "Eject",
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
      console.log(`Sign Up completed, Welcome!`)

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
      if (ans.confirmation) {
        data[0] = Number(data[0]) - ans["amount"]
        console.log("Here is the receipt, thank you!")
        console.log(`Amount taken: ${ans.amount}`)
        console.log(`Current Amount in ATM flashdrive: ${data[0]}`)
        let d = new Date()
        console.log(`Data occure1d: ${d.toUTCString()}`)

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
        message: "Are you sure you want to checky your balance?",
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
  console.log("Thank you for your patience...")
  inProcess = 0
  currentFlashdrive = null
  // process.exit(1)
}

usbDetect.startMonitoring()

let currentFlashdrive = null

// Main program
let inProcess = 0
console.log("Please plug/replug the flashdrive...")

usbDetect.on("add", function (device) {
  // console.log("add", device)

  if (currentFlashdrive == null) {
    if (device.deviceName.match("Storage")) {
      inProcess = 1
      currentFlashdrive = device

      let directive = `./database/${device.vendorId}-${device.productId}.txt`
      let newUser = 0

      try {
        fs.readFileSync(directive, "utf8", (err) => {})
      } catch (error) {
        newUser = 1
        console.log("Detected new device! Good day, please sign-up first!")
      }

      if (newUser) {
        signUpPrompt(directive)
      } else {
        optionPrompt(directive)
      }
    }
  }
})

usbDetect.on("remove", function (device) {
  if (currentFlashdrive || inProcess) {
    console.clear()
    console.log("Oops, unexpected event happened...")
    currentFlashdrive = null
    inProcess = 0
  }
})
