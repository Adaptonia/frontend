import * as admin from 'firebase-admin';

const serviceAccount = {
  type: "service_account",
  project_id: "adaptonia-538b3",
  private_key_id: "e79a2529ae27659587791aed82ec05cce5312264",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDEpflS5mUEpn4i\nDiNySAtk1P1to0FyNMpc8f//TBfyQUJ1kgVER5aREJ1CcBuNB7TN2tmFZRTxzAnP\nPKSX1HVNxrgFaS6K+zQOmZUZZk1ITaJtvuQpYSlzoEBrAM/Amkd7LwGVYUx1hkom\nj1AggDKdqvYiIItYdtimQkAzoPk4ssb8cvRCMP5tuzKId7uYqsn+u4lTbxwjU4rg\nk8OsYg0hp4cn+iviLYhiUnpwC7hp7/cVQrniPu39Zmc1j69ETMv/BjdC39VncPZn\nxAx3Ghd39HnnsNEZfT9VqQeTrJ3HguTH3pjVjyqMSVa7lj4wniO5XiIh0LRETaTm\nZo3sVydHAgMBAAECggEABA2chMLoh7hoY4qBdiEm0V5tr5oGOhswcjEviTMn6Zkp\nJeprXviCxMN5s+oPoOm5v+YOebT9qFL/5Y+aBnvqKj8GtMXYOb3q8sOwbD3/9ckn\nDrZsIxY0ZOrp3DEmFxHKMcj92JBeCd+v6fkmOguqZc/yRsqY7kSoCBukqx70RBQR\n8ZaxRIFAsAUNZ9nZQHxreG2ZYRdIPoW+Fr92pSSZoCR3X+v0MI2/wRPtukO0siMK\n/41BXniIFOSifEj/AliDA8LsFHkQQGNZNf0laMqJMkwpiqbAC5ntgyTq5Fey1Pyj\nF/cj8fMtF/XdqYfoLcayHe65I+ejmNZnvDInwn+pgQKBgQD6/YTOvARxtN3fBwoH\nT56dR1jYy/QY+hA35rEBQWI3KoUgBeOJySxyp9C4eyuxnUIDIGWrMmOufT1oMIcj\nJpy4jrAsPKjoA5My6/gKRJAM8XIlkJBtYAg+WefOkK1AUA0TFJJiW+4N45ng4qti\nrJxQNLxQIkOiyXeHjnvMw0+moQKBgQDIksjqKvSbCTGBRfxQw2Ln80w2HzJJstrl\n33AtuLFhsDzMpBKrjZtekuuB3POhUuhCwkCRqEtp1Yjbq8FYxI3H4iJfb6w3Btnl\nzE/gBTeQxe3uEv8hQD8ygnVB3qZfYi7spjbtkdOhB6QpK1NMc8Uzckd7iP4w2XFp\nCVNzygBM5wKBgG4e4TAbSg/hfR8nZX0Dr+HttcuY4IY84PTF4I9ecoslurbsHoML\notbDTk5CrE8HYjkg87qDJz0dcd3OvNvtSwGmiSE/lBQHzYOgCHnozxL+tEhK/zMd\n2UASDiSRUZJQDQx8ECXbk7zASXljujJW7VY7bQvznJ1Fq43sM+EJKF9BAoGADOvX\n4a4OwAYhmFBn5tQPhR3ZZQsxdCn/jBuO4IMrej2eTRis0zx2K+uPHHidgWET8WkO\nO9P5t8G35V71P8C52Yyp5jgNgiYA15sH8kijwcHeiB3VLdEzwQ9CepHbaf2rRDeZ\nBkkEtzUE0FooLZ6vr5bHICA9L+xyL/AX3je/OTUCgYAJGSXV0qHOovCWvZaaEn1v\nF4Cqeoe1xGlvq7VmjMdZeIty6iDhdpVnX/XdKEXlCXWxDj4YpfSYlhg8tFjp8sV9\nUMBP7da4P58YgFv6MlJsFE5k0iF0BFihJCrsnHnaykjZR591sY10alu6PK5I7y7L\n9T/FCxGzZRskLjFCelvHVw==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@adaptonia-538b3.iam.gserviceaccount.com",
  client_id: "110464700448090857326",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40adaptonia-538b3.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Firebase Admin if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

export default admin; 
