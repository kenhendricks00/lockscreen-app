Pod::Spec.new do |s|
  s.name           = 'AudioRoute'
  s.version        = '1.0.0'
  s.summary        = 'Tells the app whether audio is going to headphones.'
  s.license        = 'MIT'
  s.author         = 'lockscreen-app'
  s.homepage       = 'https://github.com/kenhendricks00/lockscreen-app'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/kenhendricks00/lockscreen-app.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,swift}'
end
