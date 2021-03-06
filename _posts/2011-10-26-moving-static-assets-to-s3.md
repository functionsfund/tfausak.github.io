---
title: Moving static assets to S3
---

At Famigo, we serve lots of static assets. Every application
we review has an icon, some screenshots (with thumbnails), and some
associated content like logos and background images. An app like
iBlast Moki weighs in with more than 200 KB of images.

Up until last week, we weren't serving up those images in the best
way. Our web server runs [Django][3] with [MongoDB][4] as the
database. We also use [lighttpd][5] to serve some static assets,
like our logo. Any time you wanted to see an app's icon, it went
through Django and MongoDB before giving it to you.

Not any more! We realized our page would load much faster if more
things went through lighttpd. Then, we realized app icons don't
change all that often; we could probably let [Amazon S3][6] handle
them. Finally, we got smart and put everything on [Amazon CloudFront][7].
The end result? Most of our requests got ten times faster! (From
about 200 ms to 20 ms on average.) Here's how we did it.

Since we're using Django, we'll use Amazon's [S3 library for
Python][8] to communicate with S3. Add that module and a few constants
to your project for you access key, secret key, and bucket. Amazon
lets you use vanity URLs (like "bucket.s3.amazonaws.com"), provided
that your bucket is unique. We set our desired bucket name and
concatenated it with our access key to make it unique.

``` python
AWS_ACCESS_KEY = '...'
AWS_SECRET_KEY = '...'
AWS_BUCKET = 'famigo-static'
AWS_BUCKET = '{0}-{1}'.format(AWS_ACCESS_KEY, AWS_BUCKET).lower()
```

On to the hard part: moving everything from the database to S3.
Create a [Django admin command][9] to do this. The first thing we
need to do is connect to S3 and make sure our bucket exists.

``` python
import httplib, S3
connection = S3.AWSAuthConnect(AWS_ACCESS_KEY, AWS_SECRET_KEY)
if connection.check_bucket_exists(AWS_BUCKET) != httplib.OK:
    connection.create_bucket(AWS_BUCKET)
```

For every app in our database, we want to get its icon and send it
over to S3. We also want to make it publicly readable so people can
access it without a token. And, just like our bucket, our object
keys need to be unique. We'll be using the app's package name as
its key.

``` python
for application in Application.objects:
    key = '{0}-icon'.format(application.package_name)
    content = application.icon.read()
    connection.put(AWS_BUCKET, key, content, {'x-amz-acl': 'public-read'})
```

Now the icon is stored on Amazon's server. We'll need a way to get
it back, though. Amazon's S3 library has a URL generator that does
exactly that.

``` python
generator = S3.QueryStringAuthGenerator(AWS_ACCESS_KEY, AWS_SECRET_KEY)
for application in Application.objects:
    url = generator.make_bare_url(AWS_BUCKET, key) # with key as before
    application.icon_url = url
    application.save()
```

The final step is using the new URL in templates. Assuming you were using
Django's URL tag already, this is a piece of cake. Replace all instances of
`{% raw %}{% url application_icon application.id %}{% endraw %}`
with `{% raw %}{{ application.icon_url }}{% endraw %}`. If you're
not using the URL tag, you'll have to jump through a few more hoops, but
the end result should be the same.

That's it! You are now serving static assets through Amazon S3.
Getting CloudFront set up to serve them through a CDN is an optional
step, and one I won't cover. It involves lots of administration and
very little code.

*Update (Oct 31):* As noted in [a Reddit comment][10], it's a good idea
to set `Expires` (or `Cache-Control`) headers on your static assets. When
using S3, you want to add another entry to the headers dictionary. It
should end up looking like this:

``` python
{
    'Cache-Control': 'max-age=604800, public',
    'x-amz-acl': 'public-read',
}
```

For a more detailed look at caching, I suggest [Mark Nottingham][11]'s
[caching tutorial][12].

[3]: https://www.djangoproject.com
[4]: http://www.mongodb.org
[5]: http://www.lighttpd.net
[6]: http://aws.amazon.com/s3/
[7]: http://aws.amazon.com/cloudfront/
[8]: https://github.com/boto/boto
[9]: https://docs.djangoproject.com/en/dev/howto/custom-management-commands/
[10]: http://www.reddit.com/r/programming/comments/lqklm/moving_static_assets_to_s3/c2vjmeh
[11]: http://www.mnot.net
[12]: http://www.mnot.net/cache_docs/
