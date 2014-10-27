ExDFrontend
=================

Neurorobotics experiment designer. Let the user choose an environment, a robot and the connection between a brain model and the robot in order to create a neurorobotics experiment.

INSTALL
=======

Local Install
-------------
Install dependencies:

```
gem install bundler
bundle install

npm install
```

on puppetized machines (w/o sudo rights for bundle):
```
sudo gem install bundler

# or, if no sudo for gem:
# gem install --user-install --no-ri --no-rdoc bundler
# export PATH="$PATH:$HOME/.gem/ruby/1.9.1/bin"

bundle install --path $HOME/local/bundle

export PATH="$PATH:$HOME/local/bundle/ruby/1.9.1/bin/"

npm install
```

Create a valid app/config.json from app/config.json.sample

run
```
grunt server
```