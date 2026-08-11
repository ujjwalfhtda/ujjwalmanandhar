# frozen_string_literal: true

require "webrick"
require "json"

ROOT = File.expand_path(__dir__)
PORT = (ARGV.first || ENV["PORT"] || 3000).to_i

def clean_title(name)
  name.gsub(/[_-]+/, " ").gsub(/\s+/, " ").strip
end

def list_images
  Dir.glob(File.join(ROOT, "image", "*.{jpg,jpeg,png,webp,gif}")).
    grep_v(/(^|\/)\.[^\/]+$/).
    uniq.
    sort_by { |f| -File.mtime(f).to_f }.
    map { |f| f.delete_prefix("#{ROOT}/") }
end

def list_videos
  Dir.glob(File.join(ROOT, "video", "*.{mp4,mov,webm,m4v}")).
    grep_v(/(^|\/)\.[^\/]+$/).
    uniq.
    sort_by { |f| -File.mtime(f).to_f }.
    map do |f|
      name = File.basename(f, File.extname(f))
      poster = File.join("image", "video-posters", "#{name}.jpg")
      poster = nil unless File.exist?(File.join(ROOT, poster))
      { "src" => f.delete_prefix("#{ROOT}/"), "title" => clean_title(name), "poster" => poster }
    end
end

server = WEBrick::HTTPServer.new(
  Port: PORT,
  DocumentRoot: ROOT,
  AccessLog: [],
  Logger: WEBrick::Log.new($stdout, WEBrick::Log::WARN)
)

server.mount_proc "/gallery.json" do |_req, res|
  res["Content-Type"] = "application/json"
  res["Cache-Control"] = "no-store"
  res.body = JSON.generate("images" => list_images, "videos" => list_videos)
end

%w[INT TERM].each { |sig| trap(sig) { server.shutdown } }

puts "Serving portfolio at http://localhost:#{PORT}"
server.start
