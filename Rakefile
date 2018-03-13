task default: [:build]

desc 'Build the site'
task :build do
  sh(*%w(jekyll build))
end

desc 'Serve the site'
task :serve do
  sh(*%w(jekyll serve --drafts --future --incremental --watch))
end

desc 'Remove assets'
task :clean do
  sh(*%w(rm -f -r
    _site/
    static/images/apple-touch-icon-114x114.png
    static/images/apple-touch-icon-120x120.png
    static/images/apple-touch-icon-144x144.png
    static/images/apple-touch-icon-152x152.png
    static/images/apple-touch-icon-57x57.png
    static/images/apple-touch-icon-60x60.png
    static/images/apple-touch-icon-72x72.png
    static/images/apple-touch-icon-76x76.png
    static/images/apple-touch-startup-image-1496x2048.png
    static/images/apple-touch-startup-image-1536x2008.png
    static/images/apple-touch-startup-image-320x460.png
    static/images/apple-touch-startup-image-640x1096.png
    static/images/apple-touch-startup-image-640x920.png
    static/images/apple-touch-startup-image-748x1024.png
    static/images/apple-touch-startup-image-768x1004.png
    static/images/favicon-16.png
    static/images/favicon-256.png
    static/images/favicon-32.png
    static/images/favicon-48.png
    static/images/favicon.ico
    static/images/og-image.png
  ))
end

desc 'Rasterize images'
multitask :images
def image(name, width, height = width, background: '#f5f5f5', rotate: true)
  "static/images/#{name}.png".tap do |path|
    args = [
      '-filter', 'point',
      '-background', background,
      '-density', ([width, height].min * 72.0 / 7.0).round(1).to_s,
      '-gravity', 'center'
    ]

    if rotate && width > height
      args += ['-rotate', '90']
      width, height = height, width
    end

    args += [
      '-extent', "#{width}x#{height}",
      '_includes/logo.svg', path
    ]

    task images: [path]
    file path do
      sh('convert', *args)
    end
  end
end

image('og-image', 300)
[57, 60, 72, 76, 114, 120, 144, 152].each do |size|
  image("apple-touch-icon-#{size}x#{size}", size)
end
[[320, 460], [640, 920], [640, 1096], [1024, 748], [768, 1004], [2048, 1496], [1536, 2008]].each do |(width, height)|
  size = width > height ? "#{height}x#{width}" : "#{width}x#{height}"
  image("apple-touch-startup-image-#{size}", width, height)
end

favicons = []
[16, 32, 48, 256].each do |size|
  favicons << image("favicon-#{size}", size)
end
file 'static/images/favicon.ico' => favicons do |t|
  sh("convert -colors 16 #{t.prerequisites.join(' ')} #{t.name}")
end
task images: ['static/images/favicon.ico']
